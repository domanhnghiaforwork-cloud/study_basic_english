"""Create explicit English/Vietnamese maps. Refuse to overwrite reviewed maps."""
from pathlib import Path
import hashlib
import json
import re

from build_lessons import STAGE, read_source


# One Vietnamese line for each source chunk; grouping below joins related chunks.
TRANSLATIONS = [
'''Tôi làm quen với một gia đình mới ở ngôi nhà bên cạnh nhà mình.
Một cậu bé mở cửa.
Cậu ấy có một chú chó nhỏ, và nó muốn chơi đùa.
Em gái cậu ấy đi ra ngoài.
Cô bé đưa cho tôi một quả bóng và nói: “Bạn có thể chơi cùng bọn mình.” Bố mẹ hai bạn đang ở trong bếp.
Họ chuẩn bị đồ ăn cho mọi người.
Tôi đưa bóng cho cậu bé và hỏi cậu ấy về chú chó.
Sau đó, tôi giúp em gái cậu ấy mang túi vào nhà.
Chúng tôi ngồi quanh một chiếc bàn nhỏ, cùng ăn và nói chuyện về trường của mình.
Đến cuối buổi chiều, tôi đã có thêm hai người bạn mới.''',
'''Gia đình tôi đã sẵn sàng ra khỏi nhà, nhưng cạnh cửa có hai chiếc túi màu xanh dương.
“Túi nào của em, túi nào của anh?” tôi hỏi anh trai.
Anh mở một chiếc túi và cho chúng tôi xem một cuốn sách màu đỏ.
“Đây là sách của em,” anh nói.
Tôi mở chiếc túi còn lại và thấy giày của anh.
Bố mẹ bật cười trước cảnh hai anh em loay hoay.
Chúng tôi xếp đúng đồ vào từng túi rồi mang chúng ra ngoài.
Một chú chó nhỏ đang đợi cạnh ô tô với quả bóng của nó.
Lần này, ai cũng biết mình cần mang gì.
Cuối cùng, cả nhà có thể cùng nhau bắt đầu ngày mới.''',
'''Sáng nay, tôi tìm thấy một bức ảnh cũ trên bàn bếp.
“Cậu bé kia là ai vậy?” tôi hỏi mẹ.
“Bố con đấy,” mẹ nói.
“Bố đang làm gì và ở đâu vậy ạ?” Mẹ kể rằng bố đang chơi gần ngôi nhà cũ của mình.
“Mẹ chụp bức ảnh này khi nào ạ?” tôi hỏi.
Mẹ nói lúc đó tôi còn chưa ra đời.
Những câu hỏi ấy khiến mẹ mỉm cười.
Mẹ lấy ra thêm một chiếc hộp.
“Tại sao mẹ giữ tất cả những bức ảnh kia?” tôi hỏi.
“Chúng giúp mẹ lưu giữ kỷ niệm,” mẹ nói.
Giờ tôi hiểu một bức ảnh nhỏ có thể chứa đựng cả một câu chuyện lớn như thế nào.''',
'''Ai đó để quên một chiếc túi nhỏ trên xe buýt.
“Túi này của ai vậy?” bác tài hỏi.
Không ai trả lời.
Bác nhìn vào trong và tìm thấy một thứ hữu ích: một cuốn sách có ghi tên trên đó.
“Có ai biết một cô bé tên Mai không?” bác hỏi.
Mọi người nhìn quanh, nhưng cô bé không có ở đó.
Cô bé học trường nào nhỉ?
Cuốn sách giúp bác tìm được câu trả lời.
Trong túi không có gì khác ngoài một chiếc bút.
Bác không lấy thứ gì ra ngoài.
Đến trạm tiếp theo, bác gọi cho nhà trường.
Mai đến cùng mẹ, kiểm tra lại đồ đạc và cảm ơn bác vì đã giúp đỡ.''',
'''Tất cả bạn bè của chúng tôi đều đến nhà ăn trưa.
Chúng tôi có nhiều táo, nhưng chỉ có vài chiếc cốc.
Trong bếp có một ít trà, còn trong chai có một chút sữa.
“Nhà mình có bánh mì không?” em gái tôi hỏi.
Có, nhưng không còn nhiều.
Tôi cắt bánh mì thành những miếng nhỏ để ai cũng được ăn.
Hầu hết mọi người đều muốn uống trà, nên chúng tôi cần thêm nước.
Bố tôi mang thêm một chai nước từ bếp ra.
Lần này, chúng tôi cho ít đường hơn vào trà.
Ai cũng thích đồ ăn, và không ai rời bàn mà vẫn còn đói.''',
'''Thứ Sáu hằng tuần, hai người bạn đến phòng sách nhỏ của chúng tôi.
Cả hai đều thích truyện, nhưng không phải lúc nào cũng chọn cùng một cuốn sách.
Hôm nay, mỗi bạn có thể mang một cuốn sách về nhà.
Một cậu bé muốn đọc truyện về một chú chó.
Bạn của cậu lại muốn một câu chuyện khác, về gia đình.
Trên bàn có hai cuốn sách, nhưng cả hai đều không phù hợp với các bạn ấy.
Tôi chỉ cho hai bạn vài cuốn sách khác cạnh cửa sổ.
“Các bạn có thể chọn một trong hai cuốn này,” tôi nói.
Giờ thì đã có đủ sách cho mọi người.
Hai bạn ngồi xuống đọc trước khi quyết định chọn sách.''',
'''Hai đứa trẻ đứng đợi cạnh cửa trường.
Ba bạn nữa đến, vậy là bây giờ có năm bạn.
Cô giáo mang đến bốn quả bóng, và bọn trẻ giúp cô mang chúng ra ngoài.
Sáu phụ huynh ngồi gần tường để xem.
Chúng tôi chơi một trò với các con số: tôi nói “bảy”, và mọi người bước bảy bước nhỏ.
Sau đó tôi nói “tám”, và tất cả cùng vỗ tay tám lần.
Những số tiếp theo là chín và mười.
Đến mười một giờ sáng, chúng tôi vừa mệt vừa vui.
Chúng tôi ngồi dưới gốc cây, uống nước và hỏi cô giáo liệu ngày mai có thể chơi tiếp không.''',
'''Lúc mười hai giờ, cô giáo đặt những tấm thẻ số lên bàn.
Chúng tôi phải xếp chúng theo thứ tự trước bữa trưa.
Tôi tìm thấy thẻ số mười ba và mười bốn dưới một cuốn sách.
Bạn tôi đang cầm thẻ số mười lăm và mười sáu.
Một bạn khác nhặt thẻ số mười tám và mười chín từ dưới sàn lên.
Chúng tôi đặt thẻ số hai mươi ở cuối, nhưng có điều gì đó không đúng.
Giữa số mười sáu và mười tám có một chỗ trống.
Thẻ số mười bảy đâu rồi?
Chúng tôi nhìn quanh và tìm thấy nó sau một chiếc ghế.
Khi chúng tôi làm xong, đồng hồ chỉ mười hai giờ ba mươi.
Cô giáo mỉm cười, còn chúng tôi để sẵn những tấm thẻ cho lớp học tiếp theo.''',
'''Tôi cùng gia đình đến một buổi bán sách.
Bàn đầu tiên bày sách cũ, còn bàn thứ hai bày sách mới.
Ở bàn thứ ba, trẻ em có thể đọc sách miễn phí.
Mẹ cho tôi năm mươi nghìn đồng để mua sách.
Tôi chọn một cuốn truyện giá bốn mươi nghìn và giữ lại số tiền còn thừa.
Năm ngoái, trường bán được một trăm cuốn sách trong một ngày.
Năm nay, mọi người hy vọng bán được nhiều hơn.
Em trai tôi muốn mang tiền của mình đến buổi bán sách tiếp theo.
Còn bây giờ, em ngồi cạnh tôi và xem tranh trong cuốn sách của tôi.''',
'''Hôm nay, lớp học của chúng tôi trông khác hẳn.
Trên tường có tranh, còn cạnh cửa sổ có sách.
Hôm qua, căn phòng trống không vì tất cả chúng tôi đều ở bên ngoài.
Chúng tôi đã dành một ngày để cùng dọn dẹp và sắp xếp lại căn phòng.
Cô giáo đã dạy ở trường nhiều năm, nhưng cô nói căn phòng mang lại cảm giác mới mẻ.
“Các em đã tạo ra một nơi học tập thật tốt,” cô nói với chúng tôi.
Tôi muốn là người đầu tiên đọc sách ở góc sách mới.
Bạn tôi đang ngồi rất yên lặng bên cạnh.
Bạn ấy đã mở sẵn một cuốn sách và chẳng muốn dừng đọc.''',
'''Bố để lại lời nhắn trên bàn bếp: “Bố sẽ về muộn.
Chiều nay các con giúp bố nhé?
Các con nên rửa cốc và phải cho chó uống nước.
Làm xong thì các con được ra ngoài chơi.” Tôi có thể làm những việc ấy, nhưng em trai cũng muốn giúp.
“Bố muốn chúng mình làm gì trước?” em hỏi.
Tôi đưa lời nhắn cho em xem.
Em nói em muốn rửa cốc.
Chúng tôi cùng làm và xong việc trước bữa tối.
Khi về nhà, bố hỏi: “Ai đã làm hết những việc này thế?” Cả hai chúng tôi cùng mỉm cười.''',
'''Anh em tôi muốn ra ngoài, nhưng bầu trời xám xịt.
“Có lẽ trời sắp mưa,” mẹ nói.
“Nếu đi thì các con mang áo khoác nhé.” Tôi đi tìm áo của mình và thấy nó dưới giường.
Em trai không tìm thấy áo của em, nên chúng tôi đứng đợi bên cửa sổ.
“Các con muốn ở nhà hay sang thăm bà?” mẹ hỏi.
“Vâng, mình đi thăm bà đi ạ!” tôi nói.
Lúc đầu em trai nói không, vì em muốn chơi bóng.
Rồi em nhớ đến chú chó của bà.
Hóa ra chúng tôi sẽ không phải trải qua một buổi chiều buồn chán.''',
'''Bà đã làm bánh mì cho chúng tôi từ khi tôi còn nhỏ.
Hôm nay, tôi làm phụ bếp nhí của bà.
Trước khi bắt đầu, tôi rửa tay.
Bà cho bánh vào lò trong khi tôi lau bàn.
Em trai nhỏ tuổi hơn tôi, nhưng em cũng muốn giúp.
Mặc dù chưa biết nấu ăn, em vẫn có thể mang đĩa ra.
Sau đó, chúng tôi đợi cho đến khi bánh chín.
Rồi bà mở lò, và cả căn bếp thơm lừng.
Chúng tôi ngồi ăn trưa cùng nhau.
Bánh mì rất ngon, nhưng điều tuyệt nhất là được ở bên bà.''',
'''Một lá thư của chị gái tôi nằm trên bàn.
Chị đi học xa nhà và viết thư cho tôi mỗi tuần.
Tôi ngồi trong bếp với một tách trà rồi mở thư.
Chị kể về những người bạn mới và một cửa hàng nhỏ gần trường.
Cuối thư, chị nhờ tôi gửi ảnh chú chó của gia đình.
Tôi thử chụp một tấm, nhưng nó không chịu ngồi yên nếu thiếu quả bóng.
Tôi đưa bóng cho nó, và cuối cùng nó cũng ngồi yên.
Giờ thì tôi đã có ảnh để gửi lại cho chị.''',
'''Một chú mèo nhỏ ngồi dưới chiếc ghế trong vườn nhà tôi.
Mắt nó dõi theo một con chim ở phía trên bức tường.
Phía dưới con chim, một quả bóng đỏ nằm giữa hai chiếc hộp.
Chú mèo đi qua cánh cửa đang mở rồi nấp giữa những khóm cây.
Sau đó, nó chạy băng qua vườn và nhảy qua quả bóng.
Em gái tôi nhìn quanh tìm nó nhưng không thấy.
Tôi chỉ ra phía sau cái cây lớn.
Chú mèo đang ở đó, nhìn chúng tôi.
Chúng tôi mang cho nó một bát nước rồi ngồi xuống gần đó.
Con chim vẫn đậu trên tường và quan sát.''',
'''Nhà tôi gần trường nên chúng tôi không phải đi bộ xa.
Chiều tối nay, tôi thấy ánh đèn bên trong một lớp học.
Em trai đợi bên ngoài trong khi tôi nhìn qua cửa sổ.
Một cô giáo đang đứng cạnh bàn.
Cô vẫy tay và mời chúng tôi vào phòng.
Chúng tôi mang giúp cô một ít sách lên cầu thang.
Sau đó, cô cùng chúng tôi đi xuống rồi tắt đèn.
Chúng tôi cùng đi ra ngoài qua cửa chính.
Cô cảm ơn vì chúng tôi đã giúp đỡ.
Giờ trường trông rất yên tĩnh, và chúng tôi đi bộ về nhà trước khi trời tối.''',
'''Anh trai tôi sống xa nhà, nhưng hôm nay anh đã về thăm.
Hôm qua, anh gọi điện báo rằng anh sắp về.
Giờ túi của anh đã ở đây, cạnh cửa, và ai cũng vui khi gặp anh.
Anh thường mang về một món quà nhỏ cho cả nhà.
Lần này, anh có một cuốn sách cho tôi và một ít trà cho mẹ.
“Bố có ở trong bếp không?” anh hỏi.
Bố đi ra, nở một nụ cười thật tươi với anh.
Mỗi khi anh về thăm, cả nhà luôn ăn cùng nhau.
Ngày mai, chúng tôi sẽ đi công viên, còn tối nay chúng tôi chỉ muốn ngồi trò chuyện.''',
'''Tôi thường ngồi cạnh đọc sách với em gái sau bữa tối.
Đôi khi, em nhờ tôi đọc lại đúng câu chuyện cũ.
Em chẳng bao giờ chán chú chó nhỏ trong sách.
Tối nay, em muốn tự đọc truyện.
Em đã đọc được trang đầu, nhưng trang tiếp theo vẫn còn khó.
Tôi vừa ngồi xuống thì em nhờ giúp.
“Chỉ một từ thôi,” em nói.
Tôi chỉ cho em cách đọc từ đó.
Em còn đọc được cả trang cuối, rồi mỉm cười với tôi.
Tôi cũng thấy vui.
Ngày mai, em muốn thử đọc một cuốn sách khác.''',
'''“Xin chào!” một cô bán hàng nói khi tôi bước vào cửa hàng mới.
“Cháu chào cô,” tôi đáp.
Căn phòng rất nhỏ nhưng khá đông khách.
Tôi rất muốn tìm một cuốn truyện tranh cho em trai.
“Có lẽ cô giúp được cháu,” tôi nói.
“Cho cháu một cuốn sách về chó ạ.” Cô đưa tôi xem một cuốn, nhưng tôi làm rơi nó xuống sàn.
“Cháu xin lỗi!” tôi nói khi nhặt sách lên.
Cô mỉm cười và bảo không sao.
Tôi mua sách rồi nói: “Cảm ơn cô đã giúp cháu.” Ra đến cửa, cô vẫy tay chào.
“Tạm biệt nhé!
Khi em cháu đọc xong truyện thì lại ghé nhé.”''',
'''“Chào mừng con đến nhà cô,” mẹ tôi nói với người em họ.
Em sẽ ở với gia đình tôi một tuần trong tháng này.
Buổi sáng, chúng tôi ăn bánh mì và uống sữa.
Đến trưa, bố về nhà ăn trưa.
Em họ hỏi có thể giúp việc trong bếp không.
“Được chứ,” bố nói rồi đưa em vài chiếc đĩa.
Buổi chiều, chúng tôi ra ngoài chơi.
Đến tối, chúng tôi đã mệt nên ngồi đọc sách cùng nhau.
Ban đêm, em họ gọi cho mẹ và kể về ngày của mình.
Em nói em đã muốn quay lại thăm chúng tôi lần nữa.''',
'''Năm nay, tôi muốn đọc một chút mỗi ngày.
Tôi không cần dành trọn một giờ.
Ngay cả một phút cũng là khởi đầu tốt khi tôi bận.
Vào thứ Hai, tôi đặt một cuốn sách cạnh giường.
Vào thứ Ba, tôi đọc một trang trước bữa sáng.
Đến thứ Tư, tôi đã muốn biết câu chuyện sẽ tiếp diễn ra sao.
Vào thứ Năm, tôi mang cuốn sách đến trường.
Một người bạn đọc cùng tôi vào thứ Sáu.
Chúng tôi bật cười trước một tình tiết vui trong truyện.
Bây giờ, tôi chủ động dành thời gian để đọc vì tôi thích việc đó.
Một khởi đầu nhỏ có thể trở thành điều quan trọng.''',
'''Vào thứ Bảy, chúng tôi làm một cuốn lịch gia đình.
Anh trai vẽ tranh cho tháng Một, còn tôi viết kế hoạch cho tháng Hai.
Tháng Ba, chúng tôi muốn đến thăm bà.
Sinh nhật bà vào tháng Tư.
Chúng tôi chưa có kế hoạch thăm họ hàng trong tháng Năm.
Năm học kết thúc vào tháng Sáu, và chúng tôi hy vọng đi du lịch vào tháng Bảy.
Tháng Tám thường là một tháng yên ả ở nhà.
Tháng Chín, chúng tôi trở lại trường với sách mới.
Chúng tôi chừa vài khoảng trống cho những kế hoạch chưa biết trước.
Vào Chủ nhật, chúng tôi cho bố mẹ xem lịch rồi treo nó lên tường bếp.''',
'''Tháng Mười, một người đàn ông đặt một hộp sách bên ngoài nhà mình.
Một người phụ nữ dừng lại xem và mang một cuốn truyện về nhà.
Hôm sau, cô mang trả cuốn sách, kèm thêm hai cuốn nữa.
Đến tháng Mười Một, nhiều người đã chia sẻ sách ở đó.
Một người mang đến chiếc bàn nhỏ, còn một cậu bé giúp khiêng vài chiếc ghế.
Một cô bé vẽ tranh để treo ở cửa.
Đến tháng Mười Hai, khu phố đã có một phòng đọc nhỏ.
Mọi trẻ em đều được chào đón đến đọc sách miễn phí.
Ở đó không có tivi lớn hay máy tính, chỉ có sách, ghế và những người yêu thích truyện hay.''',
'''Tôi đi công viên cùng gia đình và một người bạn.
Gần cổng có biển ghi rằng mỗi trẻ em phải đi cùng một người lớn.
Bố nắm tay tôi, còn mẹ bế em bé.
Bạn tôi đi cùng bố mẹ của bạn ấy.
Con trai của họ bằng tuổi tôi, và chúng tôi thích cùng những trò chơi.
Chúng tôi tìm chỗ dưới gốc cây rồi ngồi ăn trưa cùng nhau.
Một phụ huynh khác hỏi còn chỗ cho gia đình cô ấy không.
Chúng tôi dịch túi sang một bên và mời họ cùng ngồi.
Chẳng mấy chốc, bọn trẻ chơi đùa còn mọi người trò chuyện rôm rả.''',
'''Bà tôi muốn có một bức ảnh chụp cả gia đình.
Bà ngồi cạnh ông trong vườn.
Chú tôi đứng phía sau ông bà cùng vợ của chú.
Con gái của chú thím, người em họ bé nhỏ của tôi, ngồi trên sàn phía trước.
Cô tôi nhờ chồng bế em bé.
Anh trai và chị gái đứng cạnh tôi.
Tất cả cùng nhìn vào điện thoại, nhưng chẳng ai sẵn sàng cùng lúc.
Đầu tiên, em bé bắt đầu khóc.
Rồi ông tôi lại nhắm mắt.
Cuối cùng, chúng tôi cũng chụp được một bức ảnh đẹp.
Ai cũng đang mỉm cười, và bà nói đó là bức ảnh bà thích nhất.''',
'''Tôi tên là Lan, và hôm nay là sinh nhật tôi.
Ở tuổi lên mười, tôi có một mái nhà mới.
Nhà chúng tôi nhỏ, nhưng có một căn phòng dành riêng cho tôi.
Phòng ngủ của tôi có cửa sổ gần giường.
Phòng tắm ở đối diện phòng ngủ, còn bếp ở tầng dưới.
Một số thùng đồ vẫn nằm trên sàn, chờ chúng tôi mở ra.
Tôi tìm sách của mình rồi đặt chúng cạnh cửa sổ.
Tối nay, cả nhà cùng ăn bên một chiếc bàn nhỏ.
Không có bánh sinh nhật, nhưng mẹ nấu món tôi thích nhất.
Tôi cảm thấy hạnh phúc ở đây.''',
'''Mưa rơi trên mái nhà, và khu vườn dần tối lại.
Tôi đóng cửa sổ cạnh giường rồi kéo chăn phủ lên chân.
Cuốn sách nằm trên ghế, vừa quá tầm với của tôi.
Tôi không muốn rời chiếc gối ấm áp, nhưng rồi vẫn đứng dậy.
Qua cánh cửa mở, tôi thấy bố đang ngồi trên ghế sofa.
Mẹ ngồi bên bàn với một tách trà.
Một bức ảnh gia đình treo trên tường phía sau mẹ.
Tôi mang sách vào phòng và ngồi giữa bố mẹ.
Mưa vẫn rơi, nhưng ngôi nhà của chúng tôi thật ấm áp.''',
'''Bố không tìm thấy chìa khóa trước khi đi làm.
Bố tìm trong túi, rồi dưới một chiếc hộp nhỏ trên bàn.
Tôi bật đèn bàn vì phòng không có nhiều ánh sáng.
Chiếc quạt thổi một mảnh giấy bay ngang qua sàn.
Bố nhìn đồng hồ và nói mình đã muộn.
Tôi dời một chai nước và một chiếc cốc rỗng sang bên, nhưng vẫn không có chìa khóa.
Rồi tôi nhìn thấy thứ gì đó trong một chiếc ly cạnh hộp.
Chính là chìa khóa!
Em trai tôi đã để nó ở đó khi giúp dọn bàn.''',
'''Tối nay, chúng tôi cất điện thoại và máy tính đi trước bữa tối.
Bố tắt tivi, nhưng mẹ vẫn để đài phát thanh chạy khe khẽ.
Anh trai mang đĩa cho từng người, còn tôi bưng một bát cơm ra bàn.
Bà nhờ lấy một chiếc thìa.
Bố dùng dao cắt bánh mì, còn anh trai làm rơi chiếc nĩa.
Chúng tôi vừa cười vừa kể về một ngày của mình.
Sau bữa tối, mẹ mở sách và đọc truyện cho chúng tôi nghe.
Không ai đòi xem gì cả.
Được nghe giọng nói của người thân ngay trong phòng thật dễ chịu.''',
'''Tôi muốn gửi thư cho bà, nhưng không biết bắt đầu từ đâu.
Tôi đặt một tờ giấy lên bàn rồi cầm bút mực lên.
Sau đó, tôi đặt bút xuống và dùng bút chì trước.
Tôi viết một câu ngắn về trường học.
Có một từ tôi không biết đánh vần, nên tôi hỏi mẹ.
Mẹ giải đáp và giúp tôi viết xong thư.
Tôi thêm một bức tranh khu vườn và một bức ảnh gia đình.
Giờ bà có thể biết chúng tôi dạo này thế nào.
Tôi mong bà sẽ sớm viết thư trả lời.''',
'''Bạn tôi nói số nhà của bạn ấy, nhưng tôi lại quên trên đường đi.
Tôi nhớ màu cửa: xanh dương, với một bông hoa màu hồng trên đó.
Tôi đi qua một ngôi nhà đỏ có cổng xanh lá.
Ngôi nhà tiếp theo có tường vàng và cửa đen.
Một con mèo trắng ngủ trên chiếc ghế màu nâu của ngôi nhà ấy.
Rồi tôi nhìn thấy bông hoa mà mình nhớ.
Bạn tôi mở cửa trước khi tôi kịp gọi.
“Bạn tìm được nhà rồi!” bạn ấy nói.
Tôi bật cười và nhờ bạn viết số nhà ra giấy để lần sau khỏi quên.''',
'''Cô giáo muốn làm một góc đọc sách trong lớp.
Chúng tôi dời chiếc bàn lớn ra xa cửa sổ và đặt một chiếc bàn nhỏ vào đó.
Một bạn nam cao giúp mang vào một chiếc kệ dài.
Chúng tôi kê nó sát bức tường màu xám.
Sách cho các bạn lớn được đặt trên kệ cao, còn sách tranh nằm trên kệ thấp.
Bạn tôi mang một chiếc gối tím, còn tôi thêm một chiếc chăn màu cam.
Mỗi sáng trước giờ học, chúng tôi có chỗ để đọc một câu chuyện ngắn.
Chẳng mấy chốc, ai cũng muốn được ngồi ở góc đọc mới.''',
'''Một chiếc ghế cũ nằm bên ngoài nhà tôi.
Bố thấy nó xấu xí và muốn vứt đi.
Em trai nhỏ của tôi lại có ý tưởng khác.
Em hỏi liệu chúng tôi có thể sơn cho nó một màu mới không.
Mẹ nói đó là một kế hoạch hay.
Lớp sơn đầu tiên trông tệ vì chúng tôi dùng quá nhiều nước.
Chúng tôi thử lại, và lần này chiếc ghế trông thật đẹp.
Cô hàng xóm dừng lại ngắm.
“Chiếc ghế đẹp quá!” cô nói.
Chúng tôi thấy vui khi nghe cô khen.
Biến một thứ không ai muốn lấy thành một món đồ hữu ích thật tuyệt.''',
'''Tan học, tôi cùng em trai đi bộ về nhà giữa buổi chiều nóng bức.
Chúng tôi vừa mệt vừa đói, và em trai nói em còn khát nữa.
Rồi chúng tôi nghe tiếng một chú chó nhỏ phía sau bức tường.
Nó trông buồn bã và sợ hãi.
Em trai tức giận vì ai đó đã bỏ nó ở đó mà không cho nước uống.
Tôi bảo em bình tĩnh và gọi cho mẹ.
Mẹ mang nước đến rồi đưa chú chó đi khám bác sĩ.
Nó đang bị ốm, nhưng nếu được chăm sóc thì có thể khỏe lại.
Vài ngày sau, chúng tôi lại đến thăm.
Giờ chú chó trông khỏe mạnh, và mũi nó mát lạnh khi chạm vào tay tôi.''',
'''Tôi gặp bố từ sáng sớm để tập đi xe đạp.
Không khí mát mẻ, nhưng tay tôi thấy ấm khi nắm ghi đông.
Chúng tôi tìm một lối đi sạch sau trường, cách xa con đường bẩn.
Bố nói phần đầu rất dễ: ngồi xuống và đặt chân sẵn sàng.
Đi về phía trước thì khó hơn.
Tôi thử đi nhanh, mất thăng bằng rồi dừng lại.
Bố bảo bắt đầu chậm sẽ tốt hơn.
Tôi thử lại.
Việc này khá vất vả, nhưng sau vài lần nữa, tôi đã đạp được đến cuối lối đi.''',
'''Một thông báo nói hôm nay phòng đọc đóng cửa, nhưng bạn tôi nghĩ thông báo đó không đúng.
“Sáng nay cửa vẫn mở mà,” bạn ấy nói.
Sau bữa trưa, chúng tôi đi bộ đến đó để xem thực hư thế nào.
Lúc đầu, chúng tôi nghĩ mình đến quá muộn vì phòng phía trước trống không.
Rồi một cô gọi chúng tôi từ phía sau.
Căn phòng phía sau đầy trẻ em đang đọc sách.
“Các cháu đến đúng chỗ rồi,” cô nói.
“Thông báo ghi nhầm ngày đấy.” Chúng tôi chọn hai cuốn sách rồi ngồi xuống.
Đọc sách ở đây miễn phí nên ngày mai chúng tôi có thể quay lại.''',
'''Bố thường bận vào thứ Bảy, nhưng hôm nay bố đã sẵn sàng đi hồ cùng chúng tôi.
Đây là một ngày đặc biệt vì bà cũng đi cùng.
Chúng tôi mang món bà thích và đi một con đường khác xuyên qua khu phố.
Trước khi đi, bố dặn một điều quan trọng: ở gần nước, chúng tôi phải luôn ở sát một người lớn.
“Mình có bơi ở đó được không ạ?” em trai hỏi.
Bố chưa chắc, nên chúng tôi sẽ kiểm tra trước.
Chúng tôi muốn mọi người đều an toàn.
Ngay cả khi không bơi được, cả nhà vẫn có thể ăn uống, đi dạo và vui vẻ bên nhau.''',
'''Lớp tôi muốn mua sách mới cho trường.
Chúng tôi quyết định làm những tấm thiệp tranh nhỏ để bán vào thứ Bảy.
Cô giáo nhờ mỗi bạn mang giấy đến và đặt lên chiếc bàn lớn.
Chúng tôi cùng làm sau giờ học.
Tôi nhắn tin cho bố mẹ về buổi bán hàng.
“Bố mẹ đến sớm nếu muốn mua thiệp nhé,” tôi viết.
Vào thứ Bảy, mọi người thong thả ngắm tranh của chúng tôi.
Một số người còn góp thêm tiền để giúp đỡ.
Đến trưa, gần như tất cả thiệp đều đã bán hết.
Chúng tôi rất háo hức được chọn những cuốn sách mới.''',
'''Tôi muốn một quả bóng đá mới, nhưng hôm nay chưa cần mua.
Tôi vẫn còn một quả bóng cũ mà mình thích.
Mỗi tuần, tôi bỏ một ít tiền vào hộp thay vì ra cửa hàng tiêu.
Tôi biết mình phải tự trả tiền mua quả bóng mới.
Có những ngày tôi ghét phải chờ, nhất là khi bạn bè có đồ mới.
Mẹ nhắc tôi nghĩ về những gì mình đang có.
Tôi thích chơi cùng bạn bè, và dùng quả bóng nào thì chúng tôi cũng chơi vui.
Tôi hy vọng sớm mua được bóng mới, nhưng vẫn có thể tận hưởng ngày hôm nay.''',
'''Tôi học tiếng Anh cùng chị gái sau bữa tối.
Chị không dạy ở trường, nhưng chị thích giúp tôi học.
Trước tiên, tôi đọc một truyện ngắn.
Sau đó, tôi viết hai câu về truyện.
Nếu không hiểu điều gì, tôi nhờ chị diễn đạt theo cách khác.
Chúng tôi nói tiếng Anh vài phút trước khi kết thúc.
Đôi khi, tôi quên một từ mà hôm qua mình vẫn còn nhớ.
Chị nói với tôi rằng điều đó là bình thường.
“Hãy nhớ một câu hữu ích và dùng nó vào ngày mai,” chị nói.
Đọc một trang mỗi ngày đang giúp tôi cảm thấy tự tin hơn với tiếng Anh.''',
'''Chị em tôi nghe một âm thanh lạ sau cửa bếp.
Chúng tôi dừng lại lắng nghe.
Nghe giống tiếng một con vật nhỏ.
“Em có thấy gì không?” chị hỏi.
Tôi nhìn qua cửa sổ, nhưng trong phòng tối quá.
Chúng tôi nhờ bố giúp.
Bố mở cửa và bảo chúng tôi nhìn xuống sàn.
Một chú mèo nhỏ bước ra từ dưới ghế.
Chúng tôi thử gọi nó, nhưng nó lại chạy mất.
Sau đó, chúng tôi nói chuyện với cô hàng xóm đang tìm mèo.
Chúng tôi kể chuyện đã xảy ra và chỉ cho cô hướng nó chạy.''',
'''Những người sống trên phố chúng tôi muốn có chỗ cho trẻ em vui chơi.
Có một căn phòng trống gần cửa hàng mà không ai cần dùng.
Chúng tôi hỏi xem có thể dùng phòng vào thứ Bảy không rồi chờ câu trả lời.
Bố mẹ đến làm cùng, và chúng tôi bắt đầu bằng việc lau sàn.
Chúng tôi dừng lại uống nước rồi xếp nốt sách và trò chơi vào chỗ.
Một số bạn ở lại chơi thử, còn những bạn khác ra về ăn trưa.
Trước khi đi, chúng tôi làm một tấm biển treo ở cửa.
Giờ khu phố đã có nơi để bạn bè gặp nhau sau giờ học.''',
'''Chó nhà tôi đã già nên chúng tôi chuyển ổ nằm của nó đến gần căn bếp ấm áp.
Nó không chạy nhiều như trước nữa, nhưng vẫn thích đi dạo với chúng tôi.
Buổi sáng, chúng tôi dậy sớm và cho nó uống nước.
Nó ăn chậm, nên chúng tôi ngồi cạnh và chờ.
Khi muốn ra ngoài, nó sẽ đứng cạnh cửa.
Sau một quãng đi bộ ngắn, nó có thể ngủ hàng giờ.
Tôi biết một ngày nào đó con vật nào rồi cũng sẽ chết.
Còn bây giờ, tôi muốn chú chó của mình cảm thấy an toàn và được yêu thương.''',
'''Chị em tôi muốn nấu bữa tối trước khi bố mẹ về nhà.
Trước tiên, chúng tôi rửa tay và tìm thực phẩm trong bếp.
Tôi mặc áo cũ vì có thể sẽ bị bẩn.
Chị giúp em trai nhỏ mặc quần áo rồi em ngồi xuống xem chúng tôi nấu.
Chúng tôi bật đèn phía trên bàn và để sẵn một chiếc bát gần đó để đựng rau.
“Em cầm cái này giúp chị nhé,” chị nói khi lấy thìa.
Chúng tôi đổi kế hoạch khi không tìm thấy gạo.
Bánh mì và trứng cũng được.
Điều quan trọng là đừng mất thời gian tranh cãi.''',
'''Trong kỳ nghỉ học, bạn tôi muốn đi du lịch cùng gia đình.
Họ sẽ bay đến một thành phố khác để thăm chú của bạn ấy.
Tôi sẽ ở gần nhà, nhưng tôi cũng có kế hoạch riêng.
Bố sẽ lái xe đưa chúng tôi đến một cái hồ có thể bơi được.
Em trai muốn đạp xe đến đó, nhưng đường quá xa.
Vào thứ Sáu, chúng tôi sẽ gặp các anh chị em họ để ăn tối.
Họ thích âm nhạc và luôn rủ chúng tôi hát, nhảy cùng.
Tôi hứa sẽ gọi cho bạn và kể lại mọi chuyện.
Một kỳ nghỉ vui không nhất thiết phải đưa ta đi thật xa.''',
'''Trước buổi biểu diễn ở trường, tôi sợ đến mức muốn khóc.
Tôi muốn trở thành ca sĩ, nhưng đứng trước nhiều người thật khó.
Cô giáo bảo tôi nhìn xem căn phòng thế nào.
Cô mở cửa để cho tôi thấy những người bên trong.
“Một lỗi nhỏ không có nghĩa là em hát dở,” cô nói.
Tôi hít thở chậm rồi cố mỉm cười.
Giờ mọi thứ có vẻ không còn đáng sợ đến thế.
Dù có chuyện gì xảy ra, bạn bè sẽ giúp tôi.
Tôi bước lên sân khấu.
Trong bài hát đầu tiên, một câu hát vui khiến mọi người bật cười, và tôi thấy thoải mái hơn.''',
'''Bố giúp chúng tôi làm một ngôi nhà đồ chơi từ chiếc hộp.
Đầu tiên, chúng tôi chọn một chỗ trên bàn rồi mang hộp đến đó.
Bố dùng dao cắt một ô cửa nhỏ.
Tôi đẩy cửa ra trong khi em trai giữ vách nhà.
“Đừng kéo mạnh quá, kẻo làm hỏng nó,” bố nói.
Chúng tôi làm thêm một cửa sổ nhỏ.
Em trai làm rơi mái nhà, nhưng chúng tôi có thể dùng giấy sửa lại.
Chúng tôi ném những mẩu thừa vào một chiếc túi.
Một mẩu rơi ra ngoài miệng túi, và tôi chụp được nó.
Chẳng mấy chốc, gia đình đồ chơi nhỏ của chúng tôi đã có nhà.''',
'''Vào Chủ nhật, chúng tôi ăn sáng ở nhà bà.
Bà đặt một chiếc cốc màu xanh dương đã cũ cạnh đĩa của tôi rồi rót đầy sữa.
Bố uống cà phê, còn mẹ xin một tách trà.
Trên bàn có bánh mì cùng vài món ăn khác trong những chiếc bát nhỏ.
Bà mang cơm từ bếp ra trong khi tôi rót nước cho mọi người.
Chúng tôi ăn chậm rãi và kể chuyện trong tuần.
Một con chim hót bên ngoài cửa sổ đang mở.
Ăn xong, tôi giúp rửa cốc.
Bà bảo Chủ nhật tới tôi có thể lại đến, và tôi biết chắc mình sẽ đến.''',
'''Mẹ và tôi đi mua thực phẩm cho bữa tối.
Mẹ muốn ăn thịt gà, nhưng tôi lại muốn ăn cá.
Chúng tôi quyết định mua mỗi thứ một ít, còn loại thịt khác thì để hôm khác.
Ở cửa hàng trái cây, tôi chọn một quả táo cho mình và một quả chuối cho em trai.
Mẹ nhờ tôi tìm một loại rau xanh cho bữa ăn.
Về nhà, tôi cho một quả trứng vào bát trong khi mẹ bắt đầu nấu.
Mẹ thêm chút muối rồi nhờ tôi pha trà.
Suýt nữa tôi cho đường nhầm vào bát thức ăn.
Chúng tôi bật cười, và tôi kiểm tra trước khi cho thêm bất cứ thứ gì.''',
'''Hôm nay, một học sinh mới đến trường tôi.
Trong bữa sáng, mẹ cho tôi ít tiền ăn trưa.
Mẹ làm ở một nhà hàng nhỏ cạnh hiệu sách.
Đến trưa, tôi thấy bạn mới ngồi một mình.
Bạn ấy quên mang đồ ăn, nên tôi rủ bạn đi cùng.
Mẹ chỉ cho chúng tôi một suất ăn giá rẻ.
Chúng tôi có đủ tiền để mua rồi chia nhau ăn.
Cô giáo cũng vào ăn trưa và ngồi gần đó.
Tan học, cậu bạn cảm ơn và hỏi liệu chúng tôi có thể chơi cùng nhau trước bữa tối không.
Tôi nghĩ mình vừa có thêm một người bạn mới.''',
]

# Inclusive chunk ranges are deliberately kept together to preserve references,
# question/answer meaning, or a complete quoted note in Vietnamese.
GROUPS = {
    1: [(2, 3), (4, 5)],
    3: [(2, 3), (5, 6)],
    4: [(7, 8)],
    5: [(4, 5)],
    8: [(7, 9)],
    10: [(8, 9)],
    11: [(1, 4), (5, 6)],
    14: [(6, 7)],
    18: [(7, 8), (9, 10)],
    19: [(10, 11)],
    24: [(4, 5)],
    28: [(7, 9)],
    35: [(7, 8)],
    36: [(5, 6)],
    37: [(5, 6)],
    41: [(2, 3)],
    44: [(7, 8)],
    46: [(3, 4)],
}


def main():
    sources = sorted((STAGE / 'paragraph').glob('*.md'))
    assert len(sources) == len(TRANSLATIONS) == 50
    plans = []
    for path, translation in zip(sources, TRANSLATIONS):
        number = int(path.stem.split('_', 1)[0])
        _, paragraph = read_source(path)
        chunks = re.split(r'(?<=[.!?])\s+', paragraph)
        vi = translation.strip().splitlines()
        assert len(chunks) == len(vi), (number, len(chunks), len(vi))
        groups = dict(GROUPS.get(number, []))
        segments = []
        start = 1
        while start <= len(chunks):
            end = groups.get(start, start)
            en_text = ' '.join(chunks[start - 1:end])
            segments.append({
                'id': f's1-{number:02d}-{len(segments) + 1:02d}',
                'kind': 'group' if end > start or len(re.findall(r'[.!?](?:"|$|\s)', en_text)) > 1 else 'sentence',
                'en': en_text,
                'vi': ' '.join(vi[start - 1:end]),
            })
            start = end + 1
        mapping = {
            'schemaVersion': 1,
            'lessonId': number,
            'sourceFile': f'paragraph/{path.name}',
            'sourceSha256': hashlib.sha256(paragraph.encode('utf-8')).hexdigest(),
            'language': 'vi',
            'segments': segments,
        }
        target = STAGE / 'translations' / f'{path.stem}.json'
        assert not target.exists(), f'Refusing to overwrite reviewed translation: {target}'
        plans.append((target, mapping))
    for target, mapping in plans:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Created {len(plans)} explicit, complete translation maps.')


if __name__ == '__main__':
    main()
